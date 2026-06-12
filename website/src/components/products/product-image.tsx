"use client";

import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "src" | "unoptimized"> & {
  src: string;
};

/** Uploaded files are served by nginx; skip Next.js optimizer (returns 400 for /uploads/). */
export default function ProductImage({ src, ...props }: Props) {
  const isUploaded = src.startsWith("/uploads/");
  return <Image src={src} unoptimized={isUploaded} {...props} />;
}
