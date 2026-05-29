import { useState } from "react";
import { Button } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

const MAX_ITEMS = 5;

interface ShowMoreProps<T> {
    items: readonly T[];
    renderItems: (visible: T[]) => React.ReactNode;
    renderOverflow?: (overflow: T[]) => React.ReactNode;
}

export function ShowMore<T>({ items, renderItems, renderOverflow }: ShowMoreProps<T>) {
    const { t } = useTranslation();
    const [showAll, setShowAll] = useState(false);

    if (items.length === 0) return null;

    const hasOverflow = items.length > MAX_ITEMS;
    const visible = showAll || !hasOverflow ? items : items.slice(0, MAX_ITEMS);
    const overflow = showAll ? [] : items.slice(MAX_ITEMS);

    return (
        <>
            {renderItems(visible)}
            {hasOverflow && !showAll && (
                <Button
                    size="small"
                    startIcon={<ExpandMore />}
                    onClick={() => setShowAll(true)}
                    sx={{ mt: 1 }}
                >
                    {renderOverflow ? (
                        renderOverflow(overflow)
                    ) : (
                        t("common.showMore", { count: overflow.length })
                    )}
                </Button>
            )}
            {hasOverflow && showAll && (
                <Button
                    size="small"
                    startIcon={<ExpandLess />}
                    onClick={() => setShowAll(false)}
                    sx={{ mt: 1 }}
                >
                    {t("common.showLess")}
                </Button>
            )}
        </>
    );
}
