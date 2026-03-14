import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  boolean,
  uuid
} from 'drizzle-orm/pg-core'
import type { AdapterAccountType } from 'next-auth/adapters'

// NextAuth Tables
export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  password: text('password'), // For email/username + password credentials login
  image: text('image'),
  role: text('role').default('user').notNull(), // 'user' | 'admin'
  banned: boolean('banned').default(false),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
})

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
)

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
)

// Pastes Table
export const pastes = pgTable('pastes', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('Untitled'),
  content: text('content').notNull(),
  language: text('language').notNull().default('text'),
  alias: text('alias').unique().notNull(),
  visibility: text('visibility').default('public').notNull(),
  passwordHash: text('password_hash'),
  burnAfterReading: boolean('burn_after_reading').default(false),
  forkedFrom: uuid('forked_from'),
  views: integer('views').default(0),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

// Paste Version History
export const pasteVersions = pgTable('paste_versions', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pasteId: uuid('paste_id')
    .notNull()
    .references(() => pastes.id, { onDelete: 'cascade' }),
  title: text('title'),
  content: text('content').notNull(),
  language: text('language'),
  version: integer('version').notNull(),
  editedBy: text('edited_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

// Global Settings Table
export const appSettings = pgTable('app_settings', {
  id: text('id').primaryKey().default('global'),
  allowRegistrations: boolean('allow_registrations').notNull().default(true),
  enableGithub: boolean('enable_github').notNull().default(false),
  enableGoogle: boolean('enable_google').notNull().default(false),
  setupCompleted: boolean('setup_completed').notNull().default(false),
  instanceName: text('instance_name').default('Pesto'),
  defaultTheme: text('default_theme').default('github-dark'),
  maxPasteSize: integer('max_paste_size').default(1048576),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
})

