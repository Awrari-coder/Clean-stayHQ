--
-- PostgreSQL database dump
--

\restrict QqAV7fv36Dlk1qKebtxF7HoOjRhqXVYdyT4JxG2TJypWSTS0Vw60qgohLEsghJr

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status AS ENUM (
    'confirmed',
    'checked-in',
    'completed',
    'cancelled'
);


ALTER TYPE public.booking_status OWNER TO postgres;

--
-- Name: cleaning_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cleaning_status AS ENUM (
    'pending',
    'scheduled',
    'in-progress',
    'completed',
    'verified'
);


ALTER TYPE public.cleaning_status OWNER TO postgres;

--
-- Name: job_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.job_status AS ENUM (
    'unassigned',
    'assigned',
    'accepted',
    'in-progress',
    'completed'
);


ALTER TYPE public.job_status OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: payment_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_type AS ENUM (
    'deposit',
    'payout'
);


ALTER TYPE public.payment_type OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'host',
    'cleaner',
    'admin',
    'cleaning_company'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    property_id integer NOT NULL,
    airbnb_booking_id text,
    guest_name text NOT NULL,
    check_in timestamp without time zone NOT NULL,
    check_out timestamp without time zone NOT NULL,
    status public.booking_status DEFAULT 'confirmed'::public.booking_status NOT NULL,
    cleaning_status public.cleaning_status DEFAULT 'pending'::public.cleaning_status NOT NULL,
    amount numeric(10,2) NOT NULL,
    special_instructions text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookings_id_seq OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: cleaner_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cleaner_jobs (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    assigned_cleaner_id integer,
    assigned_company_id integer,
    status public.job_status DEFAULT 'unassigned'::public.job_status NOT NULL,
    payout_amount numeric(10,2) NOT NULL,
    scheduled_date timestamp without time zone NOT NULL,
    checklist jsonb,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    notes text
);


ALTER TABLE public.cleaner_jobs OWNER TO postgres;

--
-- Name: cleaner_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cleaner_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cleaner_jobs_id_seq OWNER TO postgres;

--
-- Name: cleaner_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cleaner_jobs_id_seq OWNED BY public.cleaner_jobs.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    job_id integer,
    type public.payment_type NOT NULL,
    amount numeric(10,2) NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    paid_at timestamp without time zone
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties (
    id integer NOT NULL,
    host_id integer NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    city text DEFAULT 'Austin'::text NOT NULL,
    state text DEFAULT 'TX'::text NOT NULL,
    zip text NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    airbnb_property_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    ical_url text
);


ALTER TABLE public.properties OWNER TO postgres;

--
-- Name: properties_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.properties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.properties_id_seq OWNER TO postgres;

--
-- Name: properties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.properties_id_seq OWNED BY public.properties.id;


--
-- Name: sync_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_logs (
    id integer NOT NULL,
    source text NOT NULL,
    status text NOT NULL,
    message text,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sync_logs OWNER TO postgres;

--
-- Name: sync_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sync_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_logs_id_seq OWNER TO postgres;

--
-- Name: sync_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sync_logs_id_seq OWNED BY public.sync_logs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'host'::public.user_role NOT NULL,
    company_id integer,
    phone text,
    avatar text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: cleaner_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cleaner_jobs ALTER COLUMN id SET DEFAULT nextval('public.cleaner_jobs_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: properties id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties ALTER COLUMN id SET DEFAULT nextval('public.properties_id_seq'::regclass);


--
-- Name: sync_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_logs ALTER COLUMN id SET DEFAULT nextval('public.sync_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, property_id, airbnb_booking_id, guest_name, check_in, check_out, status, cleaning_status, amount, special_instructions, created_at) FROM stdin;
5	4	BK-1001	John Doe	2025-12-06 03:42:30.396	2025-12-08 03:42:30.399	checked-in	scheduled	450.00	\N	2025-12-08 03:42:30.402105
7	6	BK-1003	Michael Brown	2025-12-13 03:42:30.399	2025-12-16 03:42:30.399	confirmed	scheduled	850.00	\N	2025-12-08 03:42:30.402105
8	4	BK-1004	Sarah Wilson	2025-11-28 03:42:30.399	2025-12-01 03:42:30.399	completed	completed	500.00	\N	2025-12-08 03:42:30.402105
6	5	BK-1002	Emily Smith	2025-12-09 03:42:30.399	2025-12-12 03:42:30.399	confirmed	scheduled	620.00	\N	2025-12-08 03:42:30.402105
\.


--
-- Data for Name: cleaner_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cleaner_jobs (id, booking_id, assigned_cleaner_id, assigned_company_id, status, payout_amount, scheduled_date, checklist, completed_at, created_at, notes) FROM stdin;
6	8	6	\N	completed	95.00	2025-12-01 03:42:30.408	\N	2025-12-01 03:42:30.408	2025-12-08 03:42:30.409671	\N
5	7	6	\N	completed	120.00	2025-12-16 03:42:30.408	\N	2025-12-08 04:46:27.124	2025-12-08 03:42:30.409671	\N
4	5	6	\N	completed	85.00	2025-12-08 03:42:30.408	\N	2025-12-08 04:46:28.376	2025-12-08 03:42:30.409671	\N
7	6	6	\N	assigned	85.00	2025-12-12 03:42:30.399	\N	\N	2025-12-08 04:47:43.967007	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, user_id, job_id, type, amount, status, description, created_at, paid_at) FROM stdin;
3	6	6	payout	95.00	completed	Completed cleaning at Downtown Loft	2025-12-08 03:42:30.416119	\N
4	5	\N	deposit	500.00	completed	Booking payment from Sarah Wilson	2025-12-08 03:42:30.416119	\N
5	6	5	payout	120.00	completed	Completed job #5	2025-12-08 04:46:27.140747	\N
6	6	4	payout	85.00	completed	Completed job #4	2025-12-08 04:46:28.381964	\N
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.properties (id, host_id, name, address, city, state, zip, latitude, longitude, airbnb_property_id, created_at, ical_url) FROM stdin;
4	5	Downtown Loft	123 Congress Ave	Austin	TX	78701	30.2671530	-97.7430570	ABN-12345	2025-12-08 03:42:30.392858	\N
5	5	Riverside Condo	456 S 1st St	Austin	TX	78704	30.2519040	-97.7510830	ABN-12346	2025-12-08 03:42:30.392858	\N
6	5	Hill Country Cabin	789 Ranch Rd	Dripping Springs	TX	78620	30.1899410	-98.0868150	ABN-12347	2025-12-08 03:42:30.392858	\N
\.


--
-- Data for Name: sync_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_logs (id, source, status, message, "timestamp") FROM stdin;
1	airbnb	success	Manual sync triggered by host 5	2025-12-08 04:45:00.052502
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, role, company_id, phone, avatar, created_at) FROM stdin;
5	Sarah Host	sarah@example.com	$2b$10$y4q44WSLhsgx7VWsKgoO6.065CMpnOsE3MhBaV6BFu7k8RfEbI6ia	host	\N	+1-512-555-0101	https://i.pravatar.cc/150?u=sarah	2025-12-08 03:42:30.387221
6	Mike Cleaner	mike@example.com	$2b$10$y4q44WSLhsgx7VWsKgoO6.065CMpnOsE3MhBaV6BFu7k8RfEbI6ia	cleaner	\N	+1-512-555-0102	https://i.pravatar.cc/150?u=mike	2025-12-08 03:42:30.387221
7	Jessica Cleaner	jess@example.com	$2b$10$y4q44WSLhsgx7VWsKgoO6.065CMpnOsE3MhBaV6BFu7k8RfEbI6ia	cleaner	\N	+1-512-555-0103	https://i.pravatar.cc/150?u=jess	2025-12-08 03:42:30.387221
8	Admin Alice	admin@example.com	$2b$10$y4q44WSLhsgx7VWsKgoO6.065CMpnOsE3MhBaV6BFu7k8RfEbI6ia	admin	\N	+1-512-555-0100	https://i.pravatar.cc/150?u=alice	2025-12-08 03:42:30.387221
\.


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bookings_id_seq', 8, true);


--
-- Name: cleaner_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cleaner_jobs_id_seq', 7, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 6, true);


--
-- Name: properties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.properties_id_seq', 6, true);


--
-- Name: sync_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sync_logs_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: cleaner_jobs cleaner_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cleaner_jobs
    ADD CONSTRAINT cleaner_jobs_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: sync_logs sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: cleaner_jobs cleaner_jobs_assigned_cleaner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cleaner_jobs
    ADD CONSTRAINT cleaner_jobs_assigned_cleaner_id_users_id_fk FOREIGN KEY (assigned_cleaner_id) REFERENCES public.users(id);


--
-- Name: cleaner_jobs cleaner_jobs_assigned_company_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cleaner_jobs
    ADD CONSTRAINT cleaner_jobs_assigned_company_id_users_id_fk FOREIGN KEY (assigned_company_id) REFERENCES public.users(id);


--
-- Name: cleaner_jobs cleaner_jobs_booking_id_bookings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cleaner_jobs
    ADD CONSTRAINT cleaner_jobs_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: payments payments_job_id_cleaner_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_job_id_cleaner_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.cleaner_jobs(id);


--
-- Name: payments payments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: properties properties_host_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_host_id_users_id_fk FOREIGN KEY (host_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict QqAV7fv36Dlk1qKebtxF7HoOjRhqXVYdyT4JxG2TJypWSTS0Vw60qgohLEsghJr

