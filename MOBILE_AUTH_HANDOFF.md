# Mobile app registration handoff

This document defines the student registration flow for the Fullr mobile app.
The web app owns business-owner registration; the mobile app owns student
registration. Both use the same Supabase project and `auth.users` table.

## Account contract

| Client | `auth.users.raw_user_meta_data.account_type` | Profile created | Must not create |
| --- | --- | --- | --- |
| Business web app | `store` | `Users` and `Stores` | `Student` |
| Mobile app | `student` | `Student` | `Users` and `Stores` |

The mobile client must include these metadata values during signup:

```json
{
  "account_type": "student",
  "first_name": "Ada",
  "last_name": "Lovelace"
}
```

`Student.student_id` is the same UUID as `auth.users.id`. The canonical email
is read from `auth.users.email`; it is copied into `Student.email` for the
profile record.

## One-time database migration

Run this migration once in the shared Supabase project. It is intentionally
separate from the web schema. It creates only the student table, its policies,
and the student-specific Auth trigger.

```sql
create table if not exists public."Student" (
  student_id uuid primary key references auth.users (id) on delete cascade,
  registered_at timestamptz not null default now(),
  first_name text,
  last_name text,
  email text
);

-- Make an existing Student table use the direct auth.users relationship.
do $$
declare
  student_fk text;
begin
  select c.conname
  into student_fk
  from pg_constraint c
  join pg_attribute a
    on a.attrelid = c.conrelid
   and a.attnum = any (c.conkey)
  where c.conrelid = 'public."Student"'::regclass
    and c.contype = 'f'
    and a.attname = 'student_id'
  limit 1;

  if student_fk is not null then
    execute format('alter table public."Student" drop constraint %I', student_fk);
  end if;

  -- Only legacy profiles whose Auth account was already deleted are removed.
  delete from public."Student" as s
  where not exists (
    select 1 from auth.users as u where u.id = s.student_id
  );

  alter table public."Student"
    add constraint "Student_student_id_fkey"
    foreign key (student_id) references auth.users (id) on delete cascade;
end;
$$;

create or replace function public.handle_new_student()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."Student" (student_id, first_name, last_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email
  )
  on conflict (student_id) do nothing;

  return new;
end;
$$;

-- This is independent of the web trigger named on_auth_store_owner_created.
-- Do not drop or rename the web trigger.
drop trigger if exists on_auth_student_created on auth.users;
create trigger on_auth_student_created
  after insert on auth.users
  for each row
  when (new.raw_user_meta_data->>'account_type' = 'student')
  execute function public.handle_new_student();

alter table public."Student" enable row level security;

drop policy if exists "Students can read own student profile" on public."Student";
create policy "Students can read own student profile"
  on public."Student" for select
  using (auth.uid() = student_id);

drop policy if exists "Students can update own student profile" on public."Student";
create policy "Students can update own student profile"
  on public."Student" for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

grant usage on schema public to authenticated;
grant select, update on public."Student" to authenticated;
```

The trigger runs with database privileges, so the mobile client must **not**
have a policy or grant to insert directly into `Student`.

## Swift signup

Use the project URL and publishable key only. Never ship a service-role key in
the app.

```swift
let response = try await supabase.auth.signUp(
  email: email,
  password: password,
  data: [
    "account_type": .string("student"),
    "first_name": .string(firstName),
    "last_name": .string(lastName)
  ],
  redirectTo: URL(string: "fullr://auth/callback")!
)
```

If Supabase Email Confirmation is enabled, `response.session` is `nil` until
the student confirms the email. Add `fullr://auth/callback` to Supabase
Authentication → URL Configuration → Redirect URLs, and pass incoming URLs to
the client in SwiftUI:

```swift
.onOpenURL { url in
  supabase.auth.handle(url)
}
```

## Verification checklist

1. Register a new mobile student.
2. Confirm one `auth.users` row exists with `account_type = student`.
3. Confirm one `Student` row exists with `student_id = auth.users.id`.
4. Confirm no `Users` or `Stores` row exists for that UUID.
5. Register a business through the web app and confirm the inverse: `Users`
   and `Stores` exist, with no `Student` row.

The Swift metadata and email-confirmation behavior follow the current
[Supabase Swift signup documentation](https://supabase.com/docs/reference/swift/auth-signup).
