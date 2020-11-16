
export const monotonicIncreasing = (arr: number[]): boolean =>
  arr.every((ele, index, arr) => (index > 0 ? ele > arr[index - 1] : true));

export const monotonicDecreasing = (arr: number[]): boolean =>
  arr.every((ele, index, arr) => (index > 0 ? ele < arr[index - 1] : true));
