import { memo, type ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T, index: number) => ReactNode;
    className?: string;
}

export interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string | number;
    className?: string;
    /**
     * Teks yang ditampilkan saat data kosong
     */
    emptyMessage?: string;
    /**
     * Status pemuatan opsional
     */
    isLoading?: boolean;
}

/**
 * Komponen tabel yang dapat digunakan kembali dengan dukungan untuk sel khusus, status pemuatan, dan status kosong.
 */
function Table<T>({
    data,
    columns,
    keyExtractor,
    className,
    emptyMessage = "Belum ada data tersedia",
    isLoading = false,
}: TableProps<T>) {
    if (isLoading) {
        return (
            <div className="flex h-32 w-full items-center justify-center rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-red dark:border-neutral-700 dark:border-t-brand-red"></div>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        Memuat data...
                    </span>
                </div>
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="flex h-32 w-full items-center justify-center rounded-lg border border-neutral-200 bg-white p-4 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50 font-montserrat",
                className
            )}
        >
            <table className="w-full caption-bottom text-sm text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 [&_tr]:border-b dark:[&_tr]:border-neutral-800/50">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                className={cn(
                                    "h-10 px-4 text-left align-middle font-medium text-neutral-500 dark:text-neutral-400",
                                    col.className
                                )}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {data.map((item, rowIndex) => (
                        <tr
                            key={keyExtractor(item)}
                            className="border-b border-neutral-100 transition-colors hover:bg-neutral-50/50 dark:border-neutral-800/30 dark:hover:bg-neutral-800/50"
                        >
                            {columns.map((col, colIndex) => (
                                <td
                                    key={`${keyExtractor(item)}-${colIndex}`}
                                    className={cn("p-4 align-middle", col.className)}
                                >
                                    {col.cell
                                        ? col.cell(item, rowIndex)
                                        : col.accessorKey
                                            ? (item[col.accessorKey] as ReactNode)
                                            : null}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Pernyataan tipe untuk kompatibilitas memo dengan generic
export default memo(Table) as typeof Table;
