export type Region = {
  id: string;
  name: string;
};

export type Regency = Region & {
  province_id: string;
};
