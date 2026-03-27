import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Manga } from '../models/manga.model';
import { LibraryService } from '../services/library.service';

@Component({
  selector: 'app-manga-card',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './manga-card.component.html',
  styleUrl: './manga-card.component.scss'
})
export class MangaCardComponent {
  private readonly libraryService = inject(LibraryService);

  @Input({ required: true }) manga!: Manga;

  protected isSaved(): boolean {
    return this.libraryService.isSaved(this.manga.id);
  }

  protected toggleSaved(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.libraryService.toggleSaved(this.manga.id);
  }
}
