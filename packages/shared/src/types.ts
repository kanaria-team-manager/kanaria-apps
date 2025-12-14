export interface Tag {
  id: string;
  name: string;
  teamId: string | null;
  color: string;
  systemFlag: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Label {
  id: string;
  name: string;
  teamId: string | null;
  color: string;
  systemFlag: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
