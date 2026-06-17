-- Fix product codes/barcodes with accidental leading/trailing spaces (e.g. 'DW10D ' -> 'DW10D')
UPDATE products SET code = TRIM(code) WHERE code <> TRIM(code);
UPDATE products SET barcode = TRIM(barcode) WHERE barcode IS NOT NULL AND barcode <> TRIM(barcode);
