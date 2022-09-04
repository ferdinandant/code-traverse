export const TYPE_KEY = '%%type%%';

export const encoderDecoderMap = Object.create(null);

encoderDecoderMap.Set = {
  encode: (value: Set<any>) => ({
    [TYPE_KEY]: 'Set',
    content: Array.from(value),
  }),
  decode: (value: any) => {
    const content = value.content as Array<any>;
    return new Set<any>(content);
  },
};
