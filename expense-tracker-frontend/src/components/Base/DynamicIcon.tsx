import * as Icons from "lucide-react";

interface DynamicIconProps {
  name: string; // Tên icon từ DB
  color?: string;
  size?: number;
}

export const DynamicIcon = ({ name, color, size = 20 }: DynamicIconProps) => {
  // Lấy component tương ứng từ thư viện Lucide
  const iconName = name as keyof typeof Icons;
  const LucideIcon = Icons[iconName] as React.ComponentType<Icons.LucideProps>;

  if (!LucideIcon) {
    return <Icons.HelpCircle size={size} color={color} />;
  }

  return <LucideIcon color={color} size={size} />;
};
