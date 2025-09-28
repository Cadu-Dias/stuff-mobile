export interface Asset {
    id: string,
    type: string,
    quantity: number,
    organizationId: string,
    creatorUserId: string,
    name: string,
    description: string,
    trashBin: boolean,
    createdAt: string,
    updatedAt: string,
    attributes: AttributeDetail[]
}

export interface AttributeDetail {
    id: string,
    organizationId: string,
    authorId: string,
    name: string,
    description: string,
    type: string,
    unit: string | null,
    timeUnit: string,
    options: object | null,
    required: boolean,
    trashBin: boolean,
    createdAt: string,
    updatedAt: string,
    values: Array<AttributeValue>
}

export interface AttributeValue {
    id: string,
    assetInstanceId: string,
    attributeId: string,
    value: string,
    createdAt: string,
    updatedAt: string
}

export interface SelectedAssets {
  organization: string;
  assets: Array<{
    asset_name: string;
    rfid_tag: string;
  }>;
}