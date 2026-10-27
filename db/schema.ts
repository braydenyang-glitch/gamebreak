import {sqliteTable,text,integer,primaryKey,index} from 'drizzle-orm/sqlite-core';
export const records=sqliteTable('player_records',{
 userId:text('user_id').notNull(),key:text('record_key').notNull(),payload:text('payload').notNull(),revision:integer('revision').notNull().default(1),updatedAt:text('updated_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.key]})]);
export const reports=sqliteTable('guide_reports',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),guideId:text('guide_id').notNull(),kind:text('kind').notNull(),platform:text('platform').notNull(),build:text('game_build').notNull(),details:text('details').notNull(),evidence:text('evidence').notNull(),status:text('status').notNull().default('pending'),response:text('response').notNull().default(''),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>[index('reports_user_time').on(t.userId,t.createdAt),index('reports_status').on(t.status)]);
export const edits=sqliteTable('guide_edits',{
 guideId:text('guide_id').primaryKey(),draft:text('draft').notNull(),published:text('published'),revision:integer('revision').notNull().default(1),updatedBy:text('updated_by').notNull(),updatedAt:text('updated_at').notNull()
});
export const revisions=sqliteTable('content_revisions',{
 id:integer('id').primaryKey({autoIncrement:true}),guideId:text('guide_id').notNull(),payload:text('payload').notNull(),editor:text('editor').notNull(),action:text('action').notNull(),createdAt:text('created_at').notNull()
});

export const shares=sqliteTable('shared_playbooks',{id:text('id').primaryKey(),userId:text('user_id').notNull(),payload:text('payload').notNull(),active:integer('active').notNull().default(1),createdAt:text('created_at').notNull()},t=>[index('shares_user').on(t.userId)]);
export const contributions=sqliteTable('guide_contributions',{alias:text('author_alias').notNull().default('Player'),id:text('id').primaryKey(),userId:text('user_id').notNull(),guideId:text('guide_id').notNull(),kind:text('kind').notNull(),platform:text('platform').notNull(),build:text('game_build').notNull(),details:text('details').notNull(),evidence:text('evidence').notNull(),screenshot:text('screenshot').notNull(),status:text('status').notNull().default('pending'),response:text('response').notNull().default(''),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()},t=>[index('contributions_guide').on(t.guideId,t.status),index('contributions_user').on(t.userId,t.createdAt)]);
export const votes=sqliteTable('guide_votes',{userId:text('user_id').notNull(),guideId:text('guide_id').notNull(),helpful:integer('helpful').notNull(),updatedAt:text('updated_at').notNull()},t=>[primaryKey({columns:[t.userId,t.guideId]})]);
export const sourceChecks=sqliteTable('source_checks',{url:text('url').primaryKey(),status:text('status').notNull(),httpStatus:integer('http_status').notNull(),checkedAt:text('checked_at').notNull()});

export const providerChecks=sqliteTable('provider_checks',{collectionId:text('collection_id').primaryKey(),status:text('status').notNull(),entryCount:integer('entry_count'),checkedAt:text('checked_at').notNull(),lastSuccess:text('last_success'),fingerprint:text('fingerprint').notNull().default(''),pending:integer('pending').notNull().default(0),reviewNote:text('review_note').notNull().default(''),reviewedAt:text('reviewed_at')});

export const providerSnapshots=sqliteTable('provider_snapshots',{collectionId:text('collection_id').primaryKey(),payload:text('payload').notNull(),retrievedAt:text('retrieved_at').notNull()});
export const providerLocks=sqliteTable('provider_refresh_locks',{collectionId:text('collection_id').primaryKey(),attemptedAt:text('attempted_at').notNull()});
