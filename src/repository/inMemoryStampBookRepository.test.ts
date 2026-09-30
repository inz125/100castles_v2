import { InMemoryStampBookRepository } from './inMemoryStampBookRepository'
import { describeStampBookRepositoryContract } from './stampBookRepository.contract'

describeStampBookRepositoryContract('InMemoryStampBookRepository', () => {
  return new InMemoryStampBookRepository()
})
