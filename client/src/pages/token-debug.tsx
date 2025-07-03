import { useEffect, useState } from "react";
import { useAdminApi } from "@/hooks/use-admin-api";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TokenDebug() {
  const { adminToken, isTokenValid } = useAdminApi();
  const [storedToken, setStoredToken] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("adminToken");
      setStoredToken(token);
    }
  }, []);

  const testFeatureRequests = async () => {
    if (!adminToken) return alert("No admin token available");
    
    try {
      const response = await fetch("/api/feature-requests", {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
      
      const data = await response.json();
      console.log("Feature requests response:", data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error testing feature requests:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Token Debug Page</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Admin Token Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">Token Status: {isTokenValid ? "✅ Valid" : "❌ Invalid"}</div>
              <div className="font-medium">Token:</div>
              <div className="bg-muted p-3 rounded-md overflow-x-auto">
                <pre className="text-xs break-all whitespace-pre-wrap">{adminToken || "No token"}</pre>
              </div>
              <div className="font-medium mt-4">Local Storage Token:</div>
              <div className="bg-muted p-3 rounded-md overflow-x-auto">
                <pre className="text-xs break-all whitespace-pre-wrap">{storedToken || "No token in localStorage"}</pre>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <Button onClick={testFeatureRequests} className="w-full">
                Test Feature Requests API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}