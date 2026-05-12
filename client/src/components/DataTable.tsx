import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { Search, Download, Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onAdd?: () => void;
  addLabel?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onExport?: () => void;
  emptyMessage?: string;
  emptyIcon?: typeof FileText;
}

export function DataTable<T extends { id: string }>({
  title,
  columns,
  data,
  isLoading,
  onAdd,
  addLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onExport,
  emptyMessage,
  emptyIcon: EmptyIcon = FileText,
}: DataTableProps<T>) {
  const { language } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onSearchChange && (
            <div className="relative flex-1 sm:flex-none sm:min-w-[240px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder || t("search")}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="ps-9"
                data-testid="input-table-search"
              />
            </div>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} data-testid="button-export">
              <Download className="h-4 w-4 me-2" />
              {t("export")}
            </Button>
          )}
          {onAdd && (
            <Button size="sm" onClick={onAdd} data-testid="button-add-new">
              <Plus className="h-4 w-4 me-2" />
              {addLabel || t("add")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
              <EmptyIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{emptyMessage || t("noData")}</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {columns.map((column) => (
                    <TableHead
                      key={String(column.key)}
                      className={cn("font-medium", column.className)}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "transition-colors",
                      index % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                    )}
                    data-testid={`row-item-${item.id}`}
                  >
                    {columns.map((column) => (
                      <TableCell key={String(column.key)} className={column.className}>
                        {column.render
                          ? column.render(item)
                          : String(item[column.key as keyof T] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
