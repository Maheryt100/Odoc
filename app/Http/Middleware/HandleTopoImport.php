<?php
// app/Http/Middleware/HandleTopoImport.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Inertia;

class HandleTopoImport
{
    /**
     * Injecte les données TopoManager dans les props Inertia si présentes
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Récupérer les données TopoManager si présentes
        $topoImportId = $request->input('topo_import_id');
        $topoData = $request->input('topo_data');
        $matchInfo = $request->input('match_info');
        
        if ($topoImportId && $topoData) {
            // Partager avec Inertia
            Inertia::share([
                'topo_import' => [
                    'import_id' => $topoImportId,
                    'data' => $topoData,
                    'match_info' => $matchInfo
                ]
            ]);
            
            // Stocker en session pour utilisation après redirect
            session([
                'topo_import_id' => $topoImportId,
                'topo_data' => $topoData,
                'topo_match_info' => $matchInfo
            ]);
        } elseif (session()->has('topo_import_id')) {
            // Récupérer depuis la session
            Inertia::share([
                'topo_import' => [
                    'import_id' => session('topo_import_id'),
                    'data' => session('topo_data'),
                    'match_info' => session('topo_match_info')
                ]
            ]);
            
            // Nettoyer la session après utilisation
            session()->forget(['topo_import_id', 'topo_data', 'topo_match_info']);
        }
        
        return $next($request);
    }
}