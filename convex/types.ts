export type TableNames =
  | 'users'
  | 'profiles'
  | 'roles'
  | 'pages'
  | 'pageRevisions'
  | 'talkThreads'
  | 'talkMessages'
  | 'moderationEvents'
  | 'tags'
  | 'pageTags'
  | 'watchlists'
  | 'notifications'
  | 'media'
  | 'pageMedia'
  | 'revisionReviews'
  | 'ingestionJobs'
  | 'pageLinks';

export type QueryCtx = any;
export type MutationCtx = any;

export type Id<TableName extends TableNames> = string & { __tableName: TableName };

