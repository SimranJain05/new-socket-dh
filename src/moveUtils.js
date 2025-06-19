// Utility to move an item up or down in a nested array structure by index path
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