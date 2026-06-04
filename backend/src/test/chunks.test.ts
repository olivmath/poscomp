import { chunkArray } from '../utils/chunks'

describe('chunkArray', () => {
  it('splits array into chunks of given size', () => {
    const result = chunkArray([1, 2, 3, 4, 5], 2)
    expect(result).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns single chunk when array smaller than size', () => {
    const result = chunkArray([1, 2], 10)
    expect(result).toEqual([[1, 2]])
  })

  it('returns empty array for empty input', () => {
    expect(chunkArray([], 5)).toEqual([])
  })
})
