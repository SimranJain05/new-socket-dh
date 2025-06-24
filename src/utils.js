/**
 * Converts an input array of blocks to an order + blocks structure,
 * processing dynamic groups based on the current form response.
 * @param {Array} inputArr The array of field definitions.
 * @param {Object} response The current state of the form's user responses.
 * @returns {{order: Array, blocks: Object}}
 */
export function convertToOrderBlocks(inputArr, response = {}) {
  const order = inputArr.map(item => item.id);
  const blocks = {};

  function processBlock(originalObj) {
    if (!originalObj) return {};

    const obj = { ...originalObj };

    // Check for 'dynamicOptions' key instead of 'source'
    if (obj.type === 'dynamicGroup' && obj.dynamicOptions) {
      try {
        // Use 'dynamicOptions' key to create the function
        const dynamicFunc = new Function('return (' + obj.dynamicOptions + ')')();
        const dynamicChildren = dynamicFunc(response) || [];
        obj.children = dynamicChildren;
      } catch (e) {
        console.error(`Error executing dynamic source for ID "${obj.id}":`, e);
        obj.children = [];
      }
    }

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
    return arr.filter((_, idx) => idx !== head);
  } else {
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