--
-- PostgreSQL database schema for Inspect Design
-- Schema-only version for local development
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- Comments table
CREATE TABLE public.comments (
    id integer NOT NULL,
    comment text,
    created_at timestamp without time zone,
    user_id integer,
    summary_id integer,
    insight_id integer
);

CREATE SEQUENCE public.comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;
ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);

-- Evidence table
CREATE TABLE public.evidence (
    id integer NOT NULL,
    summary_id integer,
    insight_id integer
);

CREATE SEQUENCE public.evidence_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.evidence_id_seq OWNED BY public.evidence.id;
ALTER TABLE ONLY public.evidence ALTER COLUMN id SET DEFAULT nextval('public.evidence_id_seq'::regclass);

-- Insight links table
CREATE TABLE public.insight_links (
    id integer NOT NULL,
    child_id integer,
    parent_id integer
);

CREATE SEQUENCE public.insight_links_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.insight_links_id_seq OWNED BY public.insight_links.id;
ALTER TABLE ONLY public.insight_links ALTER COLUMN id SET DEFAULT nextval('public.insight_links_id_seq'::regclass);

-- Insights table
CREATE TABLE public.insights (
    id integer NOT NULL,
    user_id integer NOT NULL,
    uid text NOT NULL,
    title text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_public boolean DEFAULT false
);

CREATE SEQUENCE public.insights_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.insights_id_seq OWNED BY public.insights.id;
ALTER TABLE ONLY public.insights ALTER COLUMN id SET DEFAULT nextval('public.insights_id_seq'::regclass);

-- Reactions table
CREATE TABLE public.reactions (
    id integer NOT NULL,
    reaction character varying(255),
    user_id integer NOT NULL,
    created_at date,
    summary_id integer,
    insight_id integer
);

CREATE SEQUENCE public.reactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.reactions_id_seq OWNED BY public.reactions.id;
ALTER TABLE ONLY public.reactions ALTER COLUMN id SET DEFAULT nextval('public.reactions_id_seq'::regclass);

-- Sources table
CREATE TABLE public.sources (
    id integer NOT NULL,
    baseurl character varying(255),
    logo_uri text
);

CREATE SEQUENCE public.sources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.sources_id_seq OWNED BY public.sources.id;
ALTER TABLE ONLY public.sources ALTER COLUMN id SET DEFAULT nextval('public.sources_id_seq'::regclass);

-- Summaries table
CREATE TABLE public.summaries (
    id integer NOT NULL,
    url character varying(255),
    title character varying(255),
    source_id integer,
    updated_at timestamp with time zone,
    created_at timestamp with time zone,
    uid text,
    original_title text
);

CREATE SEQUENCE public.summaries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.summaries_id_seq OWNED BY public.summaries.id;
ALTER TABLE ONLY public.summaries ALTER COLUMN id SET DEFAULT nextval('public.summaries_id_seq'::regclass);

-- Users table
CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    token character varying(255),
    avatar_uri text,
    profile text,
    expo_token text,
    enable_push_notifications boolean,
    enable_email_notifications boolean,
    verified boolean DEFAULT true NOT NULL,
    verification_key character varying(100),
    password_reset_key text
);

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

-- Primary keys
ALTER TABLE ONLY public.comments ADD CONSTRAINT comments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.evidence ADD CONSTRAINT evidence_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.insight_links ADD CONSTRAINT insight_links_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.insights ADD CONSTRAINT insights_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reactions ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sources ADD CONSTRAINT sources_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.summaries ADD CONSTRAINT summaries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Foreign key constraints
ALTER TABLE ONLY public.comments ADD CONSTRAINT comments_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.comments ADD CONSTRAINT comments_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.summaries(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.evidence ADD CONSTRAINT evidence_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.evidence ADD CONSTRAINT evidence_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.summaries(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.insight_links ADD CONSTRAINT insight_links_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.insights(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.insight_links ADD CONSTRAINT insight_links_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.insights(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.insights ADD CONSTRAINT insights_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reactions ADD CONSTRAINT reactions_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reactions ADD CONSTRAINT reactions_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.summaries(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reactions ADD CONSTRAINT reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.summaries ADD CONSTRAINT summaries_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX comments_insight_id_idx ON public.comments USING btree (insight_id);
CREATE INDEX comments_summary_id_idx ON public.comments USING btree (summary_id);
CREATE INDEX comments_user_id_idx ON public.comments USING btree (user_id);
CREATE INDEX evidence_insight_id_idx ON public.evidence USING btree (insight_id);
CREATE INDEX evidence_summary_id_idx ON public.evidence USING btree (summary_id);
CREATE INDEX insight_links_child_id_idx ON public.insight_links USING btree (child_id);
CREATE INDEX insight_links_parent_id_idx ON public.insight_links USING btree (parent_id);
CREATE INDEX insights_user_id_idx ON public.insights USING btree (user_id);
CREATE INDEX reactions_insight_id_idx ON public.reactions USING btree (insight_id);
CREATE INDEX reactions_summary_id_idx ON public.reactions USING btree (summary_id);
CREATE INDEX reactions_user_id_idx ON public.reactions USING btree (user_id);
CREATE INDEX summaries_source_id_idx ON public.summaries USING btree (source_id);
CREATE INDEX users_email_idx ON public.users USING btree (email);
CREATE INDEX users_username_idx ON public.users USING btree (username);
