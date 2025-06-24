import shots from '../mock/shots.json';
import fields from '../mock/fields.json';

export interface Field {
  field_id: string;
  field_name: string;
  type: string;
  editable: boolean;
  required: boolean;
  options?: string[];
}

export interface Shot {
  [key: string]: any;
  shot_id: number;
}

export default function useMockData() {
  return { shots: shots as Shot[], fields: fields as Field[] };
}

