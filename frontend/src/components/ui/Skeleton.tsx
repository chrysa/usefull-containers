import styles from "./Skeleton.module.scss";

interface Props { width?: string; height?: string; radius?: string; }

export default function Skeleton({ width = "100%", height = "16px", radius }: Props) {
  return <div className={styles.skeleton} style={{ width, height, borderRadius: radius }} />;
}
