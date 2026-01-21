import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, getAuthHeaders } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  BarChart3, 
  ExternalLink, 
  Clock,
  Upload,
  Loader2,
  Copy,
  Check,
  TrendingUp,
  Eye,
  Calendar
} from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';
import { formatDistanceToNow, format } from 'date-fns';

interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  createdAt: string;
  expiresAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Dashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/auth/documents`, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getExpiryStatus = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft < 0) {
      return { label: 'Expired', variant: 'destructive' as const, isExpired: true };
    }
    if (hoursLeft < 24) {
      return { label: 'Expires soon', variant: 'destructive' as const, isExpired: false };
    }
    if (hoursLeft < 72) {
      return { label: 'Expires in ' + Math.round(hoursLeft / 24) + 'd', variant: 'secondary' as const, isExpired: false };
    }
    return { label: formatDistanceToNow(expiry, { addSuffix: true }), variant: 'outline' as const, isExpired: false };
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeDocuments = documents.filter(doc => new Date(doc.expiresAt) > new Date());
  const expiredDocuments = documents.filter(doc => new Date(doc.expiresAt) <= new Date());

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">PDFShare</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/')} className="bg-red-500 hover:bg-red-600">
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="text-gray-600 mt-1">
            Track analytics and manage all your shared PDFs
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchDocuments} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No documents yet
              </h3>
              <p className="text-gray-600 mb-6">
                Upload your first PDF to start tracking analytics
              </p>
              <Button onClick={() => navigate('/')} className="bg-red-500 hover:bg-red-600">
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Active ({activeDocuments.length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Expired ({expiredDocuments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeDocuments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    No active documents
                  </CardContent>
                </Card>
              ) : (
                activeDocuments.map((doc) => {
                  const expiry = getExpiryStatus(doc.expiresAt);
                  const shareUrl = `${window.location.origin}/v/${doc.id}`;
                  return (
                    <Card key={doc.id} className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-7 w-7 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate text-lg">
                                {doc.fileName}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1.5 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3.5 w-3.5" />
                                  {formatFileSize(doc.fileSize)}
                                </span>
                                <span>•</span>
                                <span>{doc.pageCount} pages</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 truncate max-w-xs">
                                  {shareUrl}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(shareUrl, doc.id)}
                                  className="h-7 w-7 p-0"
                                >
                                  {copiedId === doc.id ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <Badge variant={expiry.variant} className="whitespace-nowrap">
                              <Clock className="h-3 w-3 mr-1" />
                              {expiry.label}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/v/${doc.id}`, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => navigate(`/analytics/${doc.id}`)}
                              >
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Analytics
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="expired" className="space-y-4">
              {expiredDocuments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    No expired documents
                  </CardContent>
                </Card>
              ) : (
                expiredDocuments.map((doc) => {
                  const expiry = getExpiryStatus(doc.expiresAt);
                  return (
                    <Card key={doc.id} className="opacity-60 hover:opacity-80 transition-opacity border-l-4 border-l-gray-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-700 truncate max-w-md">
                                {doc.fileName}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                <span>{formatFileSize(doc.fileSize)}</span>
                                <span>•</span>
                                <span>{doc.pageCount} pages</span>
                                <span>•</span>
                                <span>
                                  Expired {formatDistanceToNow(new Date(doc.expiresAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="destructive">
                            <Clock className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
