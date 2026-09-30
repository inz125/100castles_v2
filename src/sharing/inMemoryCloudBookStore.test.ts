import { describeCloudBookStoreContract } from './cloudBookStore.contract'
import { InMemoryCloudBookStore } from './inMemoryCloudBookStore'

describeCloudBookStoreContract('InMemoryCloudBookStore', () => new InMemoryCloudBookStore())
