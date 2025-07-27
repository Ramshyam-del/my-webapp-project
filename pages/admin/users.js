import UserList from '../../component/UserList';

export default function AdminUsers() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <UserList />
    </div>
  );
} 