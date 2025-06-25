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

// --- Move/Delete Utilities ---
/**
 * Removes an item at a given index path from a nested array structure.
 * @param {Array} arr
 * @param {Array} path
 * @returns {Array}
 */
export function removeItemInNestedArray(arr, path) {
  if (!Array.isArray(arr)) return [];
  if (path.length === 0) return arr;
  const [head, ...rest] = path;
  if (rest.length === 0) {
    // Remove at this level
    return arr.filter((_, idx) => idx !== head);
  } else {
    // Go deeper
    return arr.map((item, idx) =>
    idx === head
        ? { ...item, children: removeItemInNestedArray(item.children || [], rest) }
        : item
    );
  }
}

/**
 * Moves an item up or down in a nested array structure by index path.
 * @param {Array} arr
 * @param {Array} path
 * @param {'up'|'down'} direction
 * @returns {Array}
 */
export function moveItemInNestedArray(arr, path, direction) {
  if (path.length === 0) return arr;
  const [head, ...rest] = path;
  if (rest.length === 0) {
    // At the parent level
    const idx = head;
    const newArr = [...arr];
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === arr.length - 1)
    ) {
      return arr; // Can't move
    }
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    [newArr[idx], newArr[swapWith]] = [newArr[swapWith], newArr[idx]];
    return newArr;
  } else {
    // Go deeper
    return arr.map((item, idx) =>
      idx === head
        ? {
            ...item,
            children: moveItemInNestedArray(item.children || [], rest, direction),
          }
        : item
    );
  }
}

/**
 * Recursively updates a nested array by index path.
 * @param {Array} arr
 * @param {Array} path
 * @param {Function} updater - Function to update the target item/array
 * @returns {Array}
 */

//Purpose: Recursively updates nested array based on index path
// Helper to update nested array by index path (memoized outside component)
//path for example [2,0,1]

export const updateByIndexPath = (arr, path, updater) => {
  if (path.length === 0) return updater(arr);
  const [head, ...rest] = path;
  return arr.map((item, idx) =>
    idx === head
      ? rest.length
        ? { ...item, children: updateByIndexPath(item.children || [], rest, updater) }
        : updater(item)
      : item
  );
};
