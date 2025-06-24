// Centralized utility functions for new-socket-dh

// --- Function Caching ---
// Cache for compiled dynamic functions to avoid re-creating them on every render.
const dynamicFunctionCache = new Map();

function getDynamicFunction(source) {
  if (dynamicFunctionCache.has(source)) {
    return dynamicFunctionCache.get(source);
  }
  try {
    const func = new Function('return (' + source + ')')();
    dynamicFunctionCache.set(source, func);
    return func;
  } catch (e) {
    console.error('Error compiling dynamic source:', e);
    return () => []; // Return a function that does nothing on error
  }
}

// --- STAGE 1: Build a static template from the input JSON ---
/**
 * Processes the raw input array into a stable, memoizable "template".
 * It compiles dynamic functions but does not execute them.
 * This should only be run when the inputArr itself changes.
 */
export function buildFormTemplate(inputArr) {
  function processNode(node) {
    const { children, ...info } = node;
    const templateNode = { info };

    if (info.type === 'dynamicGroup' && info.source) {
      // Compile and cache the function, but don't run it yet
      templateNode.dynamicFunc = getDynamicFunction(info.source);
    }

    if (Array.isArray(children)) {
      templateNode.childarr = children.map(child => child.id);
      templateNode.childblocks = {};
      for (const child of children) {
        templateNode.childblocks[child.id] = processNode(child);
      }
    }
    return templateNode;
  }

  const order = inputArr.map(item => item.id);
  const blocks = {};
  for (const item of inputArr) {
    blocks[item.id] = processNode(item);
  }
  return { order, blocks };
}

// --- STAGE 2: Process the template with user responses ---
/**
 * Takes the stable template and the latest user responses to quickly
 * generate the final, renderable form structure.
 */
export function processDynamicFields(template, response) {
  function processNode(templateNode) {
    // Create a new block to be rendered, starting with the template's info
    const renderBlock = { ...templateNode };

    // If it's a dynamic block, execute its pre-compiled function
    if (templateNode.dynamicFunc) {
      const dynamicChildren = templateNode.dynamicFunc(response) || [];
      // Recursively build a template for the new dynamic children
      const dynamicTemplate = buildFormTemplate(dynamicChildren);
      renderBlock.childarr = dynamicTemplate.order;
      renderBlock.childblocks = dynamicTemplate.blocks;
    }

    // If there are static children, process them recursively
    if (templateNode.childblocks) {
      const newChildBlocks = {};
      for (const childId in templateNode.childblocks) {
        newChildBlocks[childId] = processNode(templateNode.childblocks[childId]);
      }
      renderBlock.childblocks = newChildBlocks;
    }

    return renderBlock;
  }

  const order = template.order;
  const blocks = {};
  for (const blockId in template.blocks) {
    blocks[blockId] = processNode(template.blocks[blockId]);
  }
  return { order, blocks };
}

// --- Move/Delete Utilities --- (No changes below this line)
export function removeItemInNestedArray(arr, path) {
  if (!Array.isArray(arr)) return [];
  if (path.length === 0) return arr;
  const [head, ...rest] = path;
  if (rest.length === 0) {
    return arr.filter((_, idx) => idx !== head);
  } else {
    return arr.map((item, idx) =>
    idx === head
        ? { ...item, children: removeItemInNestedArray(item.children || [], rest) }
        : item
    );
  }
}

export function moveItemInNestedArray(arr, path, direction) {
  if (path.length === 0) return arr;
  const [head, ...rest] = path;
  if (rest.length === 0) {
    const idx = head;
    const newArr = [...arr];
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === arr.length - 1)
    ) {
      return arr;
    }
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    [newArr[idx], newArr[swapWith]] = [newArr[swapWith], newArr[idx]];
    return newArr;
  } else {
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