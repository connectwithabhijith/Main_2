import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Bell, BellDot, Sparkles, MapPin, Tag, X, Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const MEDIA = API.replace("/api", "");

// ─── tiny helpers ────────────────────────────────────────────────────────────

const formatPrice = (price) => {
  if (price?.isFree) return "Free";
  if (!price?.amount) return "Contact";
  return `₹${price.amount.toLocaleString()}`;
};

const adImage = (ad) =>
  ad.images?.[0] ? `${MEDIA}${ad.images[0]}` : null;

// ─── Notification Panel ───────────────────────────────────────────────────────

const NotificationPanel = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/recommendations/notifications/${userId}`)
      .then((r) => setNotifications(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const markRead = () => {
    axios
      .post(`${API}/recommendations/notifications/${userId}/read`)
      .then(() => setNotifications((n) => n.map((x) => ({ ...x, read: true }))))
      .catch(() => {});
  };

  return (
    <div className="absolute right-0 top-10 z-50 w-80 bg-background border border-border rounded-xl shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Search Alerts</h3>
        <div className="flex gap-2">
          {notifications.some((n) => !n.read) && (
            <button onClick={markRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
          <button onClick={onClose}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
        {!loading && notifications.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No alerts yet</p>
        )}
        {notifications.map((n) => (
          <Link
            key={n._id}
            to={n.adId ? `/ad/${n.adId._id || n.adId}` : "#"}
            onClick={onClose}
            className={`block px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${
              !n.read ? "bg-primary/5" : ""
            }`}
          >
            <p className="text-sm font-medium text-foreground line-clamp-1">{n.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {new Date(n.createdAt).toLocaleDateString("en-IN")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ─── Ad Card ─────────────────────────────────────────────────────────────────

const AdCard = ({ ad, highlight }) => {
  const img = adImage(ad);
  return (
    <Link to={`/ad/${ad._id}`}>
      <Card
        className={`overflow-hidden hover:shadow-lg transition-all h-full ${
          highlight ? "ring-2 ring-primary/40" : ""
        }`}
      >
        <div className="aspect-[4/3] bg-muted relative">
          {img ? (
            <img src={img} alt={ad.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          {highlight && (
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Match
            </span>
          )}
          <Badge className="absolute top-2 right-2 capitalize text-xs">{ad.category}</Badge>
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{ad.title}</h3>
          <p className="text-sm font-bold text-primary">{formatPrice(ad.price)}</p>
          {ad.location?.city && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              {ad.location.city}, {ad.location.state}
            </div>
          )}
          {ad._recommendedReason === "search_match" && (
            <p className="text-xs text-primary mt-1 font-medium">Found what you searched!</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const RecommendedAds = ({ userId }) => {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs]   = useState(false);

  const fetchRecommendations = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    axios
      .get(`${API}/recommendations/${userId}`)
      .then((r) => {
        setRecommended(r.data.recommended || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const fetchUnread = useCallback(() => {
    if (!userId) return;
    axios
      .get(`${API}/recommendations/notifications/${userId}`)
      .then((r) => setUnreadCount(r.data.filter((n) => !n.read).length))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    fetchRecommendations();
    fetchUnread();
    // Polling every 60s for new notifications
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [fetchRecommendations, fetchUnread]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading recommendations...</span>
      </div>
    );
  }

  if (!recommended.length) return null;

  return (
    <section>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Recommended for You</h2>
          <Badge variant="secondary" className="text-xs">
            {recommended.length}
          </Badge>
        </div>

        {/* Notification bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={() => setShowNotifs((v) => !v)}
          >
            {unreadCount > 0 ? (
              <BellDot className="w-5 h-5 text-primary" />
            ) : (
              <Bell className="w-5 h-5 text-muted-foreground" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {showNotifs && (
            <NotificationPanel
              userId={userId}
              onClose={() => { setShowNotifs(false); fetchUnread(); }}
            />
          )}
        </div>
      </div>

      {/* Recommended ads grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {recommended.map((ad) => (
          <AdCard key={ad._id} ad={ad} highlight={true} />
        ))}
      </div>
    </section>
  );
};

export default RecommendedAds;