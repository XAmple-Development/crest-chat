import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDebug } from '@/hooks/useDebug';
import { Bug, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function DebugPanel() {
  const [results, setResults] = useState<any[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const { testDatabaseConnection, loading } = useDebug();

  const handleTest = async () => {
    const testResults = await testDatabaseConnection();
    setResults(testResults);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'bg-green-100 text-green-800';
      case 'FAIL':
        return 'bg-red-100 text-red-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!showPanel) {
    return (
      <Button
        onClick={() => setShowPanel(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50"
      >
        <Bug className="w-4 h-4 mr-2" />
        Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 w-96 max-h-96 overflow-y-auto z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Database Debug Panel</CardTitle>
          <Button
            onClick={() => setShowPanel(false)}
            variant="ghost"
            size="sm"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleTest}
          disabled={loading}
          className="w-full"
          size="sm"
        >
          {loading ? 'Running Tests...' : 'Run Database Tests'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Test Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="p-2 border rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{result.test}</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <Badge className={`text-xs ${getStatusColor(result.status)}`}>
                      {result.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-muted-foreground">{result.details}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
