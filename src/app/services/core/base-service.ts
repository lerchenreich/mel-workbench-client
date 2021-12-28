

import { ClientConfig } from '../../client.configs';

export class BaseService {

  constructor( protected config : ClientConfig) { 

  }
  public get hasEndpoint() : boolean { return this.config.hasEndpoint }
}