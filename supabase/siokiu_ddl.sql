--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.5




--
-- Name: cycling_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cycling_events (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text,
    county_id text NOT NULL,
    region text NOT NULL,
    date text NOT NULL,
    "time" text NOT NULL,
    meeting_point text DEFAULT ''::text,
    meeting_point_url text,
    cover_image text,
    distance numeric DEFAULT 0,
    elevation numeric DEFAULT 0,
    pace text DEFAULT '自由配速'::text,
    max_participants integer DEFAULT 20,
    strava_route_url text,
    moak_event_id text,
    sticky_color text DEFAULT 'yellow'::text,
    tags text[] DEFAULT '{}'::text[],
    creator_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    route_coordinates jsonb,
    series_id text,
    recurrence_type text
);


--
-- Name: notes_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes_templates (
    id text NOT NULL,
    name text DEFAULT ''::text,
    notes text NOT NULL,
    creator_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ride_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ride_templates (
    id text NOT NULL,
    name text NOT NULL,
    route_name text NOT NULL,
    route_detail text DEFAULT ''::text,
    route_url text DEFAULT ''::text,
    spot_name text DEFAULT ''::text,
    spot_url text DEFAULT ''::text,
    county_id text DEFAULT ''::text,
    "time" text DEFAULT '06:00'::text,
    distance real DEFAULT 0,
    elevation real DEFAULT 0,
    pace text DEFAULT ''::text,
    max_participants integer DEFAULT 0,
    notes text DEFAULT '[]'::text,
    creator_id text NOT NULL,
    creator_name text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: route_info_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.route_info_templates (
    id text NOT NULL,
    name text DEFAULT ''::text,
    route_name text NOT NULL,
    route_detail text DEFAULT ''::text,
    route_url text DEFAULT ''::text,
    distance numeric DEFAULT 0,
    elevation numeric DEFAULT 0,
    pace text DEFAULT ''::text,
    max_participants integer DEFAULT 0,
    creator_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: saved_routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_routes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    distance numeric(8,2) DEFAULT 0 NOT NULL,
    elevation numeric(8,1) DEFAULT 0 NOT NULL,
    county_id text DEFAULT ''::text NOT NULL,
    coordinates jsonb DEFAULT '[]'::jsonb NOT NULL,
    waypoints jsonb DEFAULT '[]'::jsonb NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    gpx_file_name text,
    creator_id text NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: spot_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spot_templates (
    id text NOT NULL,
    name text NOT NULL,
    url text DEFAULT ''::text,
    county_id text DEFAULT ''::text,
    creator_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tcuad_internal_placements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tcuad_internal_placements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    brand_name text NOT NULL,
    product_name text NOT NULL,
    product_url text,
    description text,
    location_tags text[] DEFAULT '{}'::text[],
    trigger_keywords text[],
    placement_text text NOT NULL,
    priority smallint DEFAULT 5 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date date,
    end_date date,
    current_impressions integer DEFAULT 0 NOT NULL,
    max_impressions integer,
    image_url text
);


--
-- Name: tcuad_placements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tcuad_placements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    brand_name text NOT NULL,
    product_name text NOT NULL,
    product_url text,
    description text,
    trigger_keywords text[],
    placement_text text NOT NULL,
    priority smallint DEFAULT 5 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date date,
    end_date date,
    current_impressions integer DEFAULT 0 NOT NULL,
    max_impressions integer,
    image_url text,
    location_tags text[] DEFAULT '{}'::text[]
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id text NOT NULL,
    name text NOT NULL,
    max_active_events integer DEFAULT 3 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    line_user_id text,
    token text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    verified_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    avatar text DEFAULT ''::text,
    county_id text DEFAULT ''::text,
    auth_provider text,
    email text,
    strava_profile jsonb,
    managed_pages jsonb DEFAULT '[]'::jsonb,
    stats jsonb DEFAULT '{"totalRides": 0, "totalDistance": 0, "totalElevation": 0, "countiesVisited": []}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    stamp_image text,
    social_avatar text,
    verified_at timestamp with time zone,
    line_verified_user_id text,
    merged_into text,
    stamp_images text DEFAULT '[]'::text,
    role text DEFAULT 'unverified'::text
);


--
-- Data for Name: cycling_events; Type: TABLE DATA; Schema: public; Owner: -
--
