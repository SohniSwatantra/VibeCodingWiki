type Role = 'super-admin' | 'moderator' | 'contributor' | 'reader';

const roleStyles: Record<Role, { label: string; className: string }> = {
  'super-admin': {
    label: 'Super Admin',
    className: 'border-[#a7d7a9] bg-[#dff0d8] text-[#1b5e20]',
  },
  moderator: {
    label: 'Moderator',
    className: 'border-[#b0c4de] bg-[#e7f1ff] text-[#1a4c8f]',
  },
  contributor: {
    label: 'Contributor',
    className: 'border-[#f8d7a1] bg-[#fff3cd] text-[#8a6d3b]',
  },
  reader: {
    label: 'Reader',
    className: 'border-[#c8ccd1] bg-[#f8f9fa] text-[#54595d]',
  },
};

type RoleBadgeProps = {
  role: Role;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const style = roleStyles[role];

  if (!style) return null;

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  );
}

