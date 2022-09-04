import fs from 'fs';
import { encoderDecoderMap } from './encoderDecoder';

const replacer = (_key: string, value: any) => {
  if (value && typeof value === 'object') {
    const valueType = value.constructor && value.constructor.name;
    if (valueType && valueType in encoderDecoderMap) {
      const { encode } = encoderDecoderMap[valueType];
      return encode(value);
    }
  }
  return value;
};

/**
 * Writes state to a file
 */
export async function saveState(state: State, targetFile: string) {
  const str = JSON.stringify(state, replacer);
  await fs.promises.writeFile(targetFile, str);
}
