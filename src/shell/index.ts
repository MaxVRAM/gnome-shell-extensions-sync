import { parse } from 'fast-xml-parser';
import { File, Settings, file_new_tmp, FileCreateFlags } from '@imports/Gio-2.0';
import { execute } from '../utils';
import { file_get_contents } from '@imports/GLib-2.0';
import { byteArray } from '@imports/Gjs';

export enum ExtensionType {
  SYSTEM = 1,
  PER_USER = 2,
}

export enum ExtensionState {
  ENABLED = 1,
  DISABLED = 2,
  ERROR = 3,
  OUT_OF_DATE = 4,
  DOWNLOADING = 5,
  INITIALIZED = 6,

  // Used as an error state for operations on unknown extensions,
  // should never be in a real extensionMeta object.
  UNINSTALLED = 99,
}

export interface ShellExtension {
  canChange: boolean;
  dir: File;
  error: any;
  hasPrefs: boolean;
  hasUpdate: boolean;
  imports: any;
  metadata: {
    name: string;
    description: string;
    uuid: string;
    'settings-schema': string;
    'shell-version': Array<string>;
  };
  path: string;
  state: ExtensionState;
  stateObj: any;
  stylesheet: File;
  type: ExtensionType;
  uuid: string;
}

const readSchemaAsJson = (schemaPath: string): any => {
  const [, contents] = file_get_contents(schemaPath);

  return parse(byteArray.toString(contents), { ignoreAttributes: false });
};

const getExtensionById = (extensionId: string): ShellExtension => imports.ui.main.extensionManager.lookup(extensionId);

const getExtensionSchemas = async (extensionId: string): Promise<any> => {
  const extension = getExtensionById(extensionId);

  const stdout = await execute(`find -L ${extension.path} -iname "*.xml" -exec grep -l "schemalist" {} +`);
  if (!stdout) {
    return {};
  }

  const schemaFiles = stdout.split('\n');

  const foundSchemas = schemaFiles
    .map((schemaFile) => readSchemaAsJson(schemaFile))
    .reduce((schemaJsonAcc, schemaJson) => {
      if (!schemaJson || !schemaJson.schemalist || !schemaJson.schemalist.schema) {
        return schemaJsonAcc;
      }

      const schema = schemaJson.schemalist.schema;

      if (Array.isArray(schema)) {
        const multipleSchemaObj = schema.reduce((acc, schemaObj) => {
          if (schemaObj['@_path']) {
            return {
              ...acc,
              [schemaObj['@_path']]: {},
            };
          }
        }, {});

        return {
          ...multipleSchemaObj,
          ...schemaJsonAcc,
        };
      } else if (schema['@_path']) {
        return {
          ...schemaJsonAcc,
          [schema['@_path']]: {},
        };
      }

      return schemaJsonAcc;
    }, {});

  return foundSchemas;
};

export const getCurrentExtension = (): ShellExtension => imports.misc.extensionUtils.getCurrentExtension();

export const getExtensionIds = (): Array<string> =>
  imports.ui.main.extensionManager
    .getUuids()
    .filter(
      (uuid: string) =>
        getExtensionById(uuid).type === ExtensionType.PER_USER && uuid !== getCurrentExtension().metadata.uuid,
    );

export const getCurrentExtensionSettings = (): Settings => imports.misc.extensionUtils.getSettings();

export const getAllExtensions = (): Array<ShellExtension> => {
  const extensionIds = getExtensionIds();
  const extensions = extensionIds
    .map((id: string): any => {
      const extension = getExtensionById(id);
      if (extension.type === ExtensionType.PER_USER) {
        return extension;
      }
      return undefined;
    })
    .filter((item) => item !== undefined);

  return extensions;
};

export const getAllExtensionSchemas = async (): Promise<any> => {
  const extensions = getAllExtensions();

  return extensions.reduce(async (extensionAcc, extension) => {
    return {
      ...(await extensionAcc),
      [extension.metadata.uuid]: await getExtensionSchemas(extension.metadata.uuid),
    };
  }, Promise.resolve({}));
};

const getExtensionConfigData = async (extensionId: string): Promise<any> => {
  const schemas = await getExtensionSchemas(extensionId);

  return Object.keys(schemas).reduce(async (acc, schema) => {
    return {
      ...(await acc),
      [schema]: await execute(`dconf dump ${schema}`),
    };
  }, Promise.resolve({}));
};

export const getAllExtensionConfigData = async (): Promise<any> => {
  const extensions = getAllExtensions();

  return extensions.reduce(async (extensionAcc, extension) => {
    return {
      ...(await extensionAcc),
      [extension.metadata.uuid]: await getExtensionConfigData(extension.metadata.uuid),
    };
  }, Promise.resolve({}));
};

export const setExtensionConfigData = async (schemaPath: string, data: string): Promise<void> => {
  if (!schemaPath || !data) {
    return;
  }
  const [file] = file_new_tmp(null);
  file.replace_contents(byteArray.fromString(data), null, false, FileCreateFlags.REPLACE_DESTINATION, null);

  await execute(`dconf load ${schemaPath} < ${file.get_path()}`);
  file.delete(null);
};

export const notify = (text: string): void => imports.ui.main.notify(text);
