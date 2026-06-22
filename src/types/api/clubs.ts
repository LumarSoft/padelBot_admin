export interface TransferConfig {
  /** MercadoPago alias/CVU players transfer the deposit to. */
  transferAlias: string | null;
  /** Account holder ("titular") shown to players alongside the alias. */
  transferHolder: string | null;
}

export interface UpdateTransferConfigRequest {
  transferAlias?: string;
  transferHolder?: string;
}
