import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      data-testid="button-language-toggle"
    >
      <Globe className="h-4 w-4" />
      <span className="sr-only">Toggle language</span>
    </Button>
  );
}
