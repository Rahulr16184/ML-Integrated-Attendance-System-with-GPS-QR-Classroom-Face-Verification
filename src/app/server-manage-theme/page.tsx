"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

type ThemeOption = 'theme-blue' | 'theme-green';

const themes: { name: string; value: ThemeOption, primaryColor: string }[] = [
    { name: "Default (Blue)", value: "theme-blue", primaryColor: "hsl(221, 83%, 53%)" },
    { name: "Nexcent (Green)", value: "theme-green", primaryColor: "hsl(142, 71%, 45%)" },
];

export default function ManageThemePage() {
    const { toast } = useToast();
    const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('theme-blue');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const savedTheme = localStorage.getItem('app-theme') as ThemeOption | null;
        if (savedTheme && themes.some(t => t.value === savedTheme)) {
            setSelectedTheme(savedTheme);
        }
    }, []);

    const handleThemeChange = (value: string) => {
        const themeValue = value as ThemeOption;
        setSelectedTheme(themeValue);
        localStorage.setItem('app-theme', themeValue);
        
        // This is a bit of a trick to force other open tabs to update
        window.dispatchEvent(new Event('storage'));

        toast({
            title: "Theme Updated",
            description: `The application theme has been set to ${themes.find(t => t.value === themeValue)?.name}.`,
        });
    };
    
    if (!isMounted) {
        return null; // Or a skeleton loader
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Application Theme</h1>
                <p className="text-muted-foreground">Select a global theme for the entire application. The change will reflect for all users.</p>
            </div>
            
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Theme Selection</CardTitle>
                    <CardDescription>Choose the primary color scheme for the user interface.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={selectedTheme} onValueChange={handleThemeChange}>
                        <div className="space-y-4">
                            {themes.map((theme) => (
                                <Label key={theme.value} htmlFor={theme.value} className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary/50">
                                    <RadioGroupItem value={theme.value} id={theme.value} />
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.primaryColor }}></div>
                                        <span className="font-medium">{theme.name}</span>
                                    </div>
                                    {selectedTheme === theme.value && <CheckCircle className="h-6 w-6 text-primary" />}
                                </Label>
                            ))}
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>
        </div>
    );
}
