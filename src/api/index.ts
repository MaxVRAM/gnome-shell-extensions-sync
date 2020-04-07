import { EventEmitter } from 'events';
import { Github } from './providers/github';
import { logger } from '../utils';
import { notify, getCurrentExtensionSettings, getAllExtensionConfigData } from '../shell';
import { Settings } from '@imports/Gio-2.0';
import { Gitlab } from './providers/gitlab';

const debug = logger('api');

export enum Status {
  SUCCESS,
  FAIL,
}

export enum ApiEvents {
  UPLOAD = 'UPLOAD',
  UPLOAD_FINISHED = 'UPLOAD_FINISHED',
  DOWNLOAD = 'DOWNLOAD',
  DOWNLOAD_FINISHED = 'DOWNLOAD_FINISHED',
}

export type SyncData = {
  syncSettings: {
    lastUpdatedAt: Date;
    autoSync: boolean;
  };
  extensions: {
    [key: string]: {
      [key: string]: string;
    };
  };
};

export enum ProviderTypes {
  GITHUB,
  GITLAB,
}

export interface Provider {
  upload(syncData: SyncData): Promise<Status>;
  download(): Promise<SyncData>;
  getName(): string;
}

export class Api {
  private provider: Provider;
  private eventEmitter: EventEmitter;
  private settings: Settings;

  constructor(eventEmitter: EventEmitter) {
    this.settings = getCurrentExtensionSettings();
    this.provider = this.getProvider();
    this.eventEmitter = eventEmitter;
    this.eventEmitter.on(ApiEvents.UPLOAD, this.upload.bind(this));
    this.eventEmitter.on(ApiEvents.DOWNLOAD, this.download.bind(this));
    this.settings.connect('changed::provider', this.updateProvider.bind(this));
  }

  async upload(): Promise<void> {
    try {
      const status: Status = await this.provider.upload({
        syncSettings: {
          lastUpdatedAt: new Date(),
          autoSync: this.settings.get_boolean('auto-sync'),
        },
        extensions: getAllExtensionConfigData(),
      });
      if (status === Status.FAIL) {
        throw new Error('Could not upload');
      }
      this.eventEmitter.emit(ApiEvents.UPLOAD_FINISHED, status);
      notify(_(`Settings successfully uploaded to ${this.getName()}`));
    } catch (ex) {
      this.eventEmitter.emit(ApiEvents.UPLOAD_FINISHED, undefined, ex);
      notify(_(`Error occured while uploading settings to ${this.getName()}. Please check the logs.`));
      debug(`error occured during upload ${ex}`);
    }
  }

  async download(): Promise<void> {
    try {
      const result: SyncData = await this.provider.download();
      this.eventEmitter.emit(ApiEvents.DOWNLOAD_FINISHED, result);
      notify(_(`Settings successfully downloaded from ${this.getName()}`));
    } catch (ex) {
      this.eventEmitter.emit(ApiEvents.DOWNLOAD_FINISHED, undefined, ex);
      notify(_(`Error occured while downloading settings from ${this.getName()}. Please check the logs.`));
      debug(`error occured during download ${ex}`);
    }
  }

  getName(): string {
    return this.provider.getName();
  }

  private getProvider(): Provider {
    const providerType = this.settings.get_enum('provider') as ProviderTypes;
    debug(`changing provider to ${ProviderTypes[providerType]}`);

    switch (providerType) {
      case ProviderTypes.GITHUB:
        return this.createGithubProvider();
      case ProviderTypes.GITLAB:
        return this.createGitlabProvider();
      default:
        return this.createGithubProvider();
    }
  }

  private updateProvider(): void {
    this.provider = this.getProvider();
  }

  private createGithubProvider(): Provider {
    const gistId = this.settings.get_string('github-gist-id');
    const gistToken = this.settings.get_string('github-gist-token');

    return new Github(gistId, gistToken);
  }

  private createGitlabProvider(): Provider {
    const snippetId = this.settings.get_string('gitlab-snippet-id');
    const snippetToken = this.settings.get_string('gitlab-snippet-token');
    const apiUrl = this.settings.get_string('gitlab-api-url') || undefined;

    return new Gitlab(snippetId, snippetToken, apiUrl);
  }
}
