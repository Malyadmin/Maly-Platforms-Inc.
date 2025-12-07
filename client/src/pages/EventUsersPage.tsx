import { useParams, useLocation, useSearch } from "wouter";
import { BackButton } from "@/components/ui/back-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function EventUsersPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const type = new URLSearchParams(search).get("type") || "attending";

  // Mock data - in a real app, this would come from an API
  const users = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    image: `/attached_assets/profile-image-${(i % 9) + 1}.jpg`,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <BackButton onClick={() => setLocation(`/event/${id}`)} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 capitalize">
          {type} Users
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-4 rounded-lg border hover:bg-foreground/10/5 cursor-pointer"
              onClick={() => setLocation(`/profile/${user.username}`)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
