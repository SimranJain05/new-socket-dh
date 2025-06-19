// Utility function to convert input JSON to order + blocks structure
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