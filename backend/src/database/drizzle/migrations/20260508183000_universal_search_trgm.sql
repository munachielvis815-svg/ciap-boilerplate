CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS users_name_trgm_idx
ON users USING GIN (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS user_profiles_display_name_trgm_idx
ON user_profiles USING GIN (lower(display_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS user_profiles_bio_trgm_idx
ON user_profiles USING GIN (lower(bio) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS user_profiles_industry_trgm_idx
ON user_profiles USING GIN (lower(industry) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS user_profiles_creator_types_trgm_idx
ON user_profiles USING GIN (
  lower(array_to_string(creator_types, ' ')) gin_trgm_ops
);
