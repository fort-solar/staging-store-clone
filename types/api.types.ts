// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FetchResponseType<T = any> = Promise<{ data?: T; error?: string }>;

export type FormProps = {
  endpoint: string;
  method?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any;
};