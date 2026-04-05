export type ApiSuccess<T> = {
  ok: true;
  version: "v1";
  data: T;
};

export type ApiError = {
  ok: false;
  version: "v1";
  error: string;
};
