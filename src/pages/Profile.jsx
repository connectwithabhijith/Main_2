import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../lib/api";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import {
  User, MapPin, Phone, Mail, Loader2, Save,
  Sparkles, Tag, Search, Bell
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API   = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const MEDIA = API.replace("/api", "");

const formatPrice = (price) => {
  if (price?.isFree) return "Free";
  if (!price?.amount) return "Contact";
  return `₹${price.amount.toLocaleString()}`;
};

// ─── Small recommended ad card for profile page ──────────────────────────────
const ProfileAdCard = ({ ad }) => {
  const img = ad.images?.[0] ? `${MEDIA}${ad.images[0]}` : null;
  return (
    <Link to={`/ad/${ad._id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow ring-1 ring-primary/20">
        <div className="aspect-video bg-muted relative">
          {img ? (
            <img src={img} alt={ad.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
          {ad._recommendedReason === "search_match" && (
            <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              Match
            </span>
          )}
          <Badge className="absolute top-1.5 right-1.5 capitalize text-[10px]">{ad.category}</Badge>
        </div>
        <CardContent className="p-3">
          <p className="font-semibold text-xs text-foreground line-clamp-2">{ad.title}</p>
          <p className="text-xs font-bold text-primary mt-1">{formatPrice(ad.price)}</p>
          {ad.location?.city && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {ad.location.city}, {ad.location.state}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

// ─── Profile page ─────────────────────────────────────────────────────────────
const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser, logout } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData]   = useState({
    name:  user?.name              || "",
    phone: user?.phone             || "",
    city:  user?.location?.city   || "",
    state: user?.location?.state  || "",
  });

  // Recommendation state
  const [recommended, setRecommended]       = useState([]);
  const [searchHistory, setSearchHistory]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [recsLoading, setRecsLoading]       = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/auth"); return; }
    if (!user?._id) return;

    // Fetch recommendations
    axios.get(`${API}/recommendations/${user._id}`)
      .then((r) => setRecommended(r.data.recommended || []))
      .catch(() => {})
      .finally(() => setRecsLoading(false));

    // Fetch search history for display
    axios.get(`${API}/recommendations/history/${user._id}`)
      .then((r) => setSearchHistory(r.data || []))
      .catch(() => {});

    // Fetch unread notification count
    axios.get(`${API}/recommendations/notifications/${user._id}`)
      .then((r) => setUnreadCount(r.data.filter((n) => !n.read).length))
      .catch(() => {});
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    setIsLoading(true);
    try {
      const updated = await authApi.updateProfile({
        name: formData.name,
        phone: formData.phone,
        location: { city: formData.city, state: formData.state },
      });
      updateUser(updated);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/"); toast.success("Logged out"); };

  const getInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

          {/* ── Avatar card ── */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{getInitials(user?.name)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{user?.name}</h2>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Mail className="w-4 h-4" /> {user?.email}
                  </p>
                  {unreadCount > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Bell className="w-4 h-4 text-primary" />
                      <span className="text-xs text-primary font-medium">
                        {unreadCount} new search alert{unreadCount > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Recommended items section ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-5 h-5 text-primary" />
                Recommended For You
                {recommended.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{recommended.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Items matching your recent searches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recsLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading recommendations...
                </div>
              )}

              {!recsLoading && recommended.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Search for items on the home page</p>
                  <p className="text-xs mt-1">We'll show matching listings here</p>
                </div>
              )}

              {!recsLoading && recommended.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {recommended.map((ad) => (
                    <ProfileAdCard key={ad._id} ad={ad} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Recent Searches ── */}
          {searchHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.slice(0, 15).map((h) => (
                    <Link key={h._id} to={`/?search=${encodeURIComponent(h.query)}`}>
                      <Badge
                        variant={h.resolved ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/20 capitalize"
                      >
                        {h.query}
                        {h.count > 1 && (
                          <span className="ml-1 text-[10px] opacity-70">×{h.count}</span>
                        )}
                        {h.resolved && <span className="ml-1 text-[10px]">✓</span>}
                      </Badge>
                    </Link>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ✓ = a matching item is now available
                </p>
              </CardContent>
            </Card>
          )}

          {/* ── Edit profile ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={formData.name} disabled={isLoading}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" type="tel" placeholder="+91 9876543210" className="pl-10"
                      value={formData.phone} disabled={isLoading}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Location</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Mumbai" value={formData.city} disabled={isLoading}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="Maharashtra" value={formData.state} disabled={isLoading}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                    : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* ── Logout ── */}
          <Card className="border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Sign Out</h3>
                  <p className="text-sm text-muted-foreground">Sign out from this device</p>
                </div>
                <Button variant="destructive" onClick={handleLogout}>Logout</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;