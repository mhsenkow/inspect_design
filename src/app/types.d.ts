export type FactReaction = {
  id?: number;
  reaction: string;
  insight_id?: number;
  summary_id?: number;
  comment_id?: number;
  user_id: number;
};

export type FactComment = {
  id?: number;
  comment?: string;
  summary_id?: number;
  insight_id?: number;
  user_id?: number;
  user?: User;
  reactions?: FactReaction[];
};

export type Follower = {
  id: number;
};

export type User = {
  id?: number;
  username?: string;
  email?: string;
  avatar_uri?: string;
  token?: string;
  enable_email_notifications?: boolean;
};

export type Indexable = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type Fact = Indexable & {
  id?: number;
  uid?: string;
  title?: string;
  reactions?: FactReaction[];
  comments?: FactComment[];
  evidence?: EvidenceRecord[];
  created_at?: string;
  updated_at?: string;
};

export type Link = Fact & {
  url: string;
  imageUrl?: string;
  logo_uri?: string;
  source_baseurl?: string;
  source: Source;
  evidence?: InsightEvidence[];
};

export type EvidenceRecord = {
  summary_id?: number;
};

export type InsightEvidence = EvidenceRecord & {
  id?: number;
  summary_id: number;
  summary: Link;
  insight_id: number;
  insight: Insight;
  comments?: FactComment[];
  reactions?: FactReaction[];
  source: Source;
};

export type Insight = Fact & {
  evidence?: InsightEvidence[];
  is_public?: boolean;
  username?: string;
  avatar_uri?: string;
  user_id?: number;
  parents: InsightLink[];
  children: InsightLink[];
  parent_uids?: string[];
};

export type Source = {
  id?: number;
  baseurl?: string;
  logo_uri?: string;
};

export type ServerFunction<T> = (
  input: T,
  token: string,
) => Promise<FLVResponse | FLVResponse[] | void>;

export type FactsListViewAction = {
  className: string;
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleOnClick: (input?: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serverFunction: ServerFunction<any>;
  enabled: boolean;
};

export type FLVResponse = {
  id?: number;
  action: -1 | 0 | 1;
  facts: Fact[];
};

export type CommentSelectedText = {
  text: string;
  commentId: number;
};

export type AuthUser = {
  user_id: number;
};

export type WithPartial<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type InsightLink = {
  id?: number;
  child_id: number;
  parent_id: number;

  parentInsight?: Insight;
  childInsight?: Insight;
};
