// Centralized utility functions for new-socket-dh
// Consolidate all reusable logic here

// --- Block Utilities ---
/**
 * Converts an input array of blocks to an order + blocks structure.
 * @param {Array} inputArr
 * @returns {{order: Array, blocks: Object}}
 */
export function convertToOrderBlocks(inputArr) {
  const order = inputArr.map(item => item.id);
  const blocks = {};
  function processBlock(obj) {
    const { children, ...info } = obj;
    let childarr = [];
    let childblocks = {};
    if (Array.isArray(children)) {
      childarr = children.map(child => child.id);
      for (const child of children) {
        childblocks[child.id] = processBlock(child);
      }
    } else if (typeof children === 'string') {
      info.dynamicChildren = children;
    }
    return { info, childarr, childblocks };
  }
  for (const item of inputArr) {
    blocks[item.id] = processBlock(item);
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
