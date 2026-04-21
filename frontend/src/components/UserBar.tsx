type UserBarProps = {
  email: string;
  onLogout: () => void;
};

export function UserBar({ email, onLogout }: UserBarProps) {
  return (
    <div className="user-bar">
      <p className="user-email">
        Signed in as <strong>{email}</strong>
      </p>
      <button type="button" className="btn-secondary" onClick={onLogout}>
        Sign out
      </button>
    </div>
  );
}
