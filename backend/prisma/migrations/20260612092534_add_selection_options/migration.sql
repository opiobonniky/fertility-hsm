-- CreateTable
CREATE TABLE "SelectionOption" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelectionOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SelectionOption_category_idx" ON "SelectionOption"("category");

-- CreateIndex
CREATE INDEX "SelectionOption_isActive_idx" ON "SelectionOption"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SelectionOption_category_label_key" ON "SelectionOption"("category", "label");
