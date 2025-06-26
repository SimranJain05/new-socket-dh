// Centralized utility functions for new-socket-dh
// Consolidate all reusable logic here

function extractDependencies(src) {
  if (typeof src !== 'string') return [];
  const deps = new Set();
  const dotRegex = /userResponse\.([a-zA-Z0-9_]+)/g;
  let m;
  while ((m = dotRegex.exec(src))) {
    deps.add(m[1]);
  }
  const bracketRegex = /userResponse\["([^\"]+)"\]/g;
  while ((m = bracketRegex.exec(src))) {
    deps.add(m[1]);
  }
  return Array.from(deps);
}

export async function evaluateSource(src, ctx = {}) {
  if (typeof src !== 'string') return src;
  const trimmed = src.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    const res = await fetch(trimmed);
    if (!res.ok) throw new Error(`Request failed ${res.status}`);
    return res.json();
  }
  try {
    let body;
    if (/^return[\s\n]/.test(trimmed)) {
      body = trimmed;
    } else {
      body = `return (${trimmed});`;
    }
    // eslint-disable-next-line no-new-func
    const wrapper = new Function('userResponse', body);
    let val = wrapper(ctx.userResponse !== undefined ? ctx.userResponse : ctx);
    if (typeof val === 'function') {
      val = val(ctx.userResponse !== undefined ? ctx.userResponse : ctx);
    }
    return await val;
  } catch (err) {
    console.error('evaluateSource failed', err);
    throw err;
  }
}

// --- Block Utilities ---
export async function convertToOrderBlocks(inputArr, userResponse = {}) {
  const order = [];
  const blocks = {};
  async function processBlock(obj) {
    if (!obj) return {};
    let workingObj = { ...obj };
    const collectedDeps = new Set();
    if (obj.source) {
      extractDependencies(obj.source).forEach(d=>collectedDeps.add(d));

  try {
    // eslint-disable-next-line no-await-in-loop
    const evaluated = await evaluateSource(obj.source, { userResponse });
    if (Array.isArray(evaluated)) {
      // If source produced multiple blocks, process them individually and return sentinel
      const processedChildren = [];
      for (const ev of evaluated) {
        const pc = await processBlock(ev);
        if (pc && pc.info && pc.info.id) processedChildren.push(pc);
      }
      return { multiple: processedChildren };
    }
    workingObj = { ...evaluated };

    // remove source so downstream components don't see raw code
    delete workingObj.source;
  } catch (err) {
    console.error('Failed to evaluate source for', obj.id, err);
  }
}
const { children, dynamicChildren, dynamicOptions, ...info } = workingObj;
    if (collectedDeps.size) {
      info.depends_on = Array.from(new Set([...(info.depends_on || []), ...collectedDeps]));
    }
    let childarr = [];
    let childblocks = {};
if (dynamicOptions) {
  extractDependencies(dynamicOptions).forEach(d=>collectedDeps.add(d));
  try {
    // eslint-disable-next-line no-await-in-loop
    const opts = await evaluateSource(dynamicOptions, { userResponse });
    info.options = Array.isArray(opts) ? opts : [];
      if (collectedDeps.size) {
        info.depends_on = Array.from(new Set([...(info.depends_on || []), ...collectedDeps]));
      }
  } catch (err) {
    console.error('Failed to eval dynamicOptions for', info.id, err);
    info.options = [];
  }
}
if (Array.isArray(children)) {
      for (const child of children) {
        const processedChild = await processBlock(child);
        if (processedChild && processedChild.info && processedChild.info.id) {
          const cid = processedChild.info.id;
          childarr.push(cid);
          childblocks[cid] = processedChild;
        }
      }
    } else if (typeof dynamicChildren === 'string') {
  try {
    // eslint-disable-next-line no-await-in-loop
    const evaluatedChildren = await evaluateSource(dynamicChildren, { userResponse });
    if (Array.isArray(evaluatedChildren)) {
      childarr = evaluatedChildren.map(child => child.id);
      for (const child of evaluatedChildren) {
        childblocks[child.id] = await processBlock(child);
      }
    }
  } catch (err) {
    console.error('Failed dynamicChildren eval for', info.id, err);
  }
} else if (typeof children === 'string') {
      info.dynamicChildren = children;
    }
    return { info, childarr, childblocks };
  }

  // helper to ingest processed output(s)
  const ingest = (processed)=>{
    if (!processed) return;
    if (processed.multiple) {
      processed.multiple.forEach(ingest);
      return;
    }
    const currentId = processed.info && processed.info.id;
    if (!currentId) return;
    order.push(currentId);
    blocks[currentId] = processed;
  };

  for (const item of inputArr) {
    const processed = await processBlock(item);
    ingest(processed);
  }
  return { order, blocks };
}

// --- Move/Delete utilities (by idPath) ---
// idPath is an array of ids representing nested path, e.g. ['section','field']
export function moveItemByIdPath(arr, idPath, direction) {
  if (!Array.isArray(arr) || idPath.length === 0) return arr;
  const [currentId, ...rest] = idPath;
  const idx = arr.findIndex(item => item.id === currentId);
  if (idx === -1) return arr;
  if (rest.length === 0) {
    const newArr = [...arr];
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === newArr.length - 1)) return arr;
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    [newArr[idx], newArr[swapWith]] = [newArr[swapWith], newArr[idx]];
    return newArr;
  }
  return arr.map((item, i) =>
    i === idx ? { ...item, children: moveItemByIdPath(item.children || [], rest, direction) } : item
  );
}

export function removeItemByIdPath(arr, idPath) {
  if (!Array.isArray(arr) || idPath.length === 0) return arr;
  const [currentId, ...rest] = idPath;
  const idx = arr.findIndex(item => item.id === currentId);
  if (idx === -1) return arr;
  if (rest.length === 0) {
    return arr.filter((_, i) => i !== idx);
  }
  return arr.map((item, i) =>
    i === idx ? { ...item, children: removeItemByIdPath(item.children || [], rest) } : item
  );
}

// Reorders only currently visible siblings based on drag result
// visibleIds: array of ids currently rendered (order before drag)
// Returns new array with those ids reordered, while non-visible items keep positions.
export function reorderByVisibleIds(arr, visibleIds, activeId, overId) {
  if (!Array.isArray(arr)) return arr;
  const idSet = new Set(visibleIds);
  const visibles = arr.filter(item => idSet.has(item.id));
  const from = visibles.findIndex(i => i.id === activeId);
  const to = visibles.findIndex(i => i.id === overId);
  if (from === -1 || to === -1) return arr;
  const newVisibles = [...visibles];
  const [moved] = newVisibles.splice(from, 1);
  newVisibles.splice(to, 0, moved);
  let vIdx = 0;
  return arr.map(item => (idSet.has(item.id) ? newVisibles[vIdx++] : item));
}

// Recursively reorder visible items at a given idPath (path to parent container)
export function reorderVisibleAtIdPath(arr, idPath, visibleIds, activeId, overId) {
  if (!Array.isArray(arr)) return arr;
  if (idPath.length === 0) {
    return reorderByVisibleIds(arr, visibleIds, activeId, overId);
  }
  const [currentId, ...rest] = idPath;
  return arr.map(item =>
    item.id === currentId
      ? {
          ...item,
          children: reorderVisibleAtIdPath(item.children || [], rest, visibleIds, activeId, overId),
        }
      : item
  );
}
