import { InMemoryMichinoekiVisitRepository } from './inMemoryMichinoekiVisitRepository'
import { describeMichinoekiVisitRepositoryContract } from './michinoekiVisitRepository.contract'

describeMichinoekiVisitRepositoryContract(
  'InMemoryMichinoekiVisitRepository',
  () => new InMemoryMichinoekiVisitRepository(),
)
